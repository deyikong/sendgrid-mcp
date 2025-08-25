import { automationTools } from "./automations.js";
import { campaignTools } from "./campaigns.js";
import { contactTools } from "./contacts.js";
import { mailTools } from "./mail.js";
import { miscTools } from "./misc.js";
import { statsTools } from "./stats.js";
import { templateTools } from "./templates.js";

export const allTools = {
  ...automationTools,
  ...campaignTools,
  ...contactTools,
  ...mailTools,
  ...miscTools,
  ...statsTools,
  ...templateTools,
};