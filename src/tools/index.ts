import { automationTools } from "./automations.js";
import { campaignTools } from "./campaigns.js";
import { contactTools } from "./contacts.js";
import { mailTools } from "./mail.js";
import { miscTools } from "./misc.js";
import { statsTools } from "./stats.js";
import { templateTools } from "./templates.js";
import { suppressionTools } from "./suppressions.js";
import { domainAuthTools } from "./domain-auth.js";
import { webhookTools } from "./webhooks.js";
import { trackingSettingsTools } from "./tracking-settings.js";
import { mailSettingsTools } from "./mail-settings.js";
import { apiKeyTools } from "./api-keys.js";
import { alertTools } from "./alerts.js";
import { teammateTools } from "./teammates.js";
import { ipTools } from "./ips.js";
import { designTools } from "./designs.js";
import { emailValidationTools } from "./email-validation.js";
import { messageSearchTools } from "./message-search.js";

export const allTools = {
  ...automationTools,
  ...campaignTools,
  ...contactTools,
  ...mailTools,
  ...miscTools,
  ...statsTools,
  ...templateTools,
  ...suppressionTools,
  ...domainAuthTools,
  ...webhookTools,
  ...trackingSettingsTools,
  ...mailSettingsTools,
  ...apiKeyTools,
  ...alertTools,
  ...teammateTools,
  ...ipTools,
  ...designTools,
  ...emailValidationTools,
  ...messageSearchTools,
};