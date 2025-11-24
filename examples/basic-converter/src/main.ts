import "./style.css";
import { defineViewModel, mountTemplate } from "pelelajs";
import { Conversor } from "./Conversor";
import template from "./Conversor.pelela";

defineViewModel("Conversor", Conversor);

const root =
  document.getElementById("app") ?? document.body;
mountTemplate(root, template);