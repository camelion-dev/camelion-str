"use client";

import { useState, type FormEvent } from "react";

export function FooterContactForm() {
  const [email, setEmail] = useState("");

  const contactCamelion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent("Contact Camelion");
    const body = encodeURIComponent(`Please contact me at ${email}.`);
    window.location.href = `mailto:hello@camelion.store?subject=${subject}&body=${body}`;
  };

  return (
    <form className="site-footer-contact-pill" onSubmit={contactCamelion}>
      <input
        required
        type="email"
        aria-label="Your email address"
        placeholder="Enter your email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <button type="submit" aria-label="Contact Camelion" title="Contact Camelion">
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
