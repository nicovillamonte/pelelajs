import "./styles.css";
import { defineViewModel, mountTemplate } from "pelelajs";
import { Twitter } from "./src/twitter";
import template from "./src/Twitter.pelela";

defineViewModel("Twitter", Twitter);

const root =
  document.getElementById("app") ?? document.body;
mountTemplate(root, template);