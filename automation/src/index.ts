/**
 * Public API of @southpage/automation.
 *
 * This is what a host (n8n Code node, serverless function, test) imports. The
 * whole framework is reachable from here, and nothing below depends on the host
 * — the same build runs in every environment.
 */
export { handleIngress } from "./handler.js";
export type { IngressRequest, HandlerDeps } from "./handler.js";
export { runPipeline } from "./pipeline.js";
export type { PipelineDeps } from "./pipeline.js";
export { buildAdapters } from "./factory.js";
export type { Adapters, Env, FactoryIO } from "./factory.js";
export { createLogger, createCapturingLogger } from "./logger.js";
export type { Logger, LogLevel } from "./logger.js";
export { AppError, toAppError, classifyHttpStatus } from "./errors.js";
export * from "./types.js";
export type { StorePort, EmailPort, NotifierPort, StoredEnquiry, EmailMessage, EmailSendResult } from "./ports.js";

export { clients, southpage } from "../config/clients/southpage.js";
export type * from "../config/schema.js";
