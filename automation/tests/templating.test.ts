import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderCustomerEmail, renderTeamEmail } from "../src/templating.js";
import { testConfig, testEnquiry } from "./helpers.js";

test("escapeHtml neutralises injection characters", () => {
  assert.equal(escapeHtml('<script>&"\''), "&lt;script&gt;&amp;&quot;&#39;");
});

test("customer email resolves placeholders and escapes HTML in the html body", () => {
  const config = testConfig();
  const enquiry = testEnquiry({ name: "Ada <b>", message: "Hi & bye" });
  const msg = renderCustomerEmail(enquiry, config);

  assert.equal(msg.to, enquiry.email);
  assert.match(msg.subject, /Thanks Ada <b>/); // subject is plain text, not escaped
  assert.match(msg.text, /Hi & bye/); // text body is raw
  assert.match(msg.html, /Hi &amp; bye/); // html body is escaped
  assert.ok(!msg.html.includes("<b>"), "user-supplied markup must be escaped in html");
});

test("team email reply-to points back at the customer", () => {
  const config = testConfig();
  const enquiry = testEnquiry();
  const msg = renderTeamEmail(enquiry, config, "team@test.co");
  assert.equal(msg.to, "team@test.co");
  assert.equal(msg.replyTo, enquiry.email);
  assert.match(msg.text, /cid-1/);
});
