const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

function getCurrentAttributeName(lineText, positionCharacter) {
  const textUpToCursor = lineText.slice(0, positionCharacter);
  const match = /(\b[\w-]+)\s*=\s*"[^"]*$/.exec(textUpToCursor);
  return match ? match[1] : null;
}

function findViewModelFile(pelelaUri) {
  const pelelaPath = pelelaUri.fsPath;
  const tsPath = pelelaPath.replace(/\.pelela$/, ".ts");
  if (fs.existsSync(tsPath)) {
    return tsPath;
  }
  return null;
}

function extractViewModelMembers(tsFilePath) {
  const text = fs.readFileSync(tsFilePath, "utf-8");

  const properties = new Set();
  const methods = new Set();

  const propRegex =
    /^\s*(?:public\s+|private\s+|protected\s+)?([a-zA-Z_]\w*)\s*(?::|=)\s*/gm;
  let match;
  while ((match = propRegex.exec(text))) {
    properties.add(match[1]);
  }

  const getterRegex =
    /^\s*(?:public\s+|private\s+|protected\s+)?get\s+([a-zA-Z_]\w*)\s*\(/gm;
  while ((match = getterRegex.exec(text))) {
    properties.add(match[1]);
  }

  const methodRegex =
    /^\s*(?:public\s+|private\s+|protected\s+)?([a-zA-Z_]\w*)\s*\(/gm;
  while ((match = methodRegex.exec(text))) {
    const name = match[1];
    if (name === "constructor") continue;
    methods.add(name);
  }

  return {
    properties: Array.from(properties),
    methods: Array.from(methods),
  };
}

function getHtmlElements() {
  return [
    "div", "span", "p", "a", "button", "input", "textarea", "select", "option",
    "label", "form", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
    "table", "tr", "td", "th", "thead", "tbody", "img", "video", "audio",
    "section", "article", "header", "footer", "nav", "aside", "main"
  ];
}

function getHtmlAttributes() {
  return [
    "id", "class", "style", "title", "data-", "aria-", "role",
    "src", "href", "alt", "type", "value", "placeholder", "name",
    "disabled", "readonly", "required", "checked", "selected",
    "width", "height", "target", "rel"
  ];
}

function activate(context) {
  vscode.commands.executeCommand('setContext', 'pelela.enabled', true);
  
  vscode.workspace.onDidOpenTextDocument((doc) => {
    if (doc.languageId === 'pelela') {
      vscode.languages.setTextDocumentLanguage(doc, 'pelela');
    }
  });

  if (vscode.window.activeTextEditor) {
    const doc = vscode.window.activeTextEditor.document;
    if (doc.languageId === 'pelela') {
      vscode.languages.setTextDocumentLanguage(doc, 'pelela');
    }
  }

  vscode.languages.setLanguageConfiguration("pelela", {
    wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/g,
  });

  const provider = vscode.languages.registerCompletionItemProvider(
    { language: "pelela", scheme: "file" },
    {
      async provideCompletionItems(document, position, token, context) {
        const items = [];

        const line = document.lineAt(position.line);
        const lineText = line.text;
        const textBeforeCursor = lineText.slice(0, position.character);
        const attributeName = getCurrentAttributeName(
          lineText,
          position.character,
        );

        const isInsideAttributeValue = !!attributeName;
        const isInsideTag = /<[^>]*$/.test(textBeforeCursor);
        const isStartingTag = /<\w*$/.test(textBeforeCursor);

        if (isStartingTag && !isInsideAttributeValue) {
          for (const tag of getHtmlElements()) {
            const item = new vscode.CompletionItem(
              tag,
              vscode.CompletionItemKind.Property
            );
            item.sortText = "z" + tag;
            items.push(item);
          }
        }

        if (isInsideTag && !isInsideAttributeValue) {
          for (const attr of getHtmlAttributes()) {
            const item = new vscode.CompletionItem(
              attr,
              vscode.CompletionItemKind.Property
            );
            item.insertText = new vscode.SnippetString(`${attr}="\${1}"`);
            item.sortText = "z" + attr;
            items.push(item);
          }

          const attrNames = [
            "view-model",
            "bind-value",
            "bind-visible",
            "bind-class",
            "bind-style",
            "click",
          ];

          for (const name of attrNames) {
            const item = new vscode.CompletionItem(
              name,
              vscode.CompletionItemKind.Property,
            );

            if (name === "view-model") {
              item.insertText = new vscode.SnippetString(
                'view-model="${1:App}"',
              );
              item.detail = "Pelela: view model asociado al template";
              item.sortText = "!0_" + name;
            } else if (name === "click") {
              item.insertText = new vscode.SnippetString(
                'click="${1:handler}"',
              );
              item.detail = "Pelela: ejecuta un método del view model al hacer click";
              item.sortText = "!0_" + name;
            } else if (name.startsWith("bind-")) {
              item.insertText = new vscode.SnippetString(
                `${name}="\${1:propiedad}"`,
              );
              item.detail = "Pelela: binding al view model";
              item.sortText = "!0_" + name;
            }

            items.push(item);
          }
        }

        if (
          isInsideAttributeValue &&
          attributeName &&
          (attributeName.startsWith("bind-") || attributeName === "click")
        ) {
          const tsFile = findViewModelFile(document.uri);
          if (tsFile) {
            const { properties, methods } = extractViewModelMembers(tsFile);

            if (attributeName.startsWith("bind-")) {
              for (const name of properties) {
                const item = new vscode.CompletionItem(
                  name,
                  vscode.CompletionItemKind.Field,
                );
                item.detail = "Pelela ViewModel property";
                item.sortText = `!0_${name}`;
                items.push(item);
              }
            } else if (attributeName === "click") {
              for (const name of methods) {
                const item = new vscode.CompletionItem(
                  name,
                  vscode.CompletionItemKind.Method,
                );
                item.detail = "Pelela ViewModel method";
                item.sortText = `!0_${name}`;
                items.push(item);
              }
            }
          }
        }

        return items;
      },
    },
    " ",
    "=",
    '"',
    "'",
    "<",
    ">",
    "/"
  );

  context.subscriptions.push(provider);
}

function deactivate() { }

module.exports = {
  activate,
  deactivate,
};
