import { workshop } from "../config";
import { IconCheck, IconWhatsApp } from "./Icons";

export function SuccessPage() {
  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon" aria-hidden>
          <IconCheck />
        </div>
        <h1>Registration Successful</h1>
        <p>
          Thank you for registering.
          <br />
          Check your WhatsApp and email for confirmation.
        </p>
        <a
          className="btn btn-primary btn-large"
          href={workshop.whatsappGroupUrl}
          target="_blank"
          rel="noreferrer"
        >
          <IconWhatsApp />
          Join WhatsApp Group
        </a>
        <a className="secondary-link" href="/">
          Back to workshop page
        </a>
      </div>
    </div>
  );
}
