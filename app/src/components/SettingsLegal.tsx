import { ExternalLink } from "lucide-react";

export type LegalPageKind = "privacy-policy" | "terms" | "guidelines" | "licenses";

const SUPPORT_URL = "https://github.com/itsmhp/SocialMedia/issues/new";

const documents: Record<Exclude<LegalPageKind, "licenses">, {
  title: string;
  effective: string;
  intro: string;
  sections: { title: string; paragraphs: string[] }[];
}> = {
  "privacy-policy": {
    title: "Privacy Policy",
    effective: "Effective October 21, 2025",
    intro: "This policy describes the data handled by the current Unggun local-first alpha.",
    sections: [
      {
        title: "Data on this device",
        paragraphs: [
          "Your handle, avatar, rooms, messages, reactions, Moments, game choices, notification preferences, and Bara are stored in this app's local browser or device storage.",
          "Raw room messages are removed from the local app when a room fades. A small Bara recap remains until you clear local activity or reset the app.",
        ],
      },
      {
        title: "Optional cloud account",
        paragraphs: [
          "When a build is connected to Supabase and you choose email sign-in, Supabase processes your email, authentication session, profile, and cloud room data. The current app does not silently upload existing local demo activity.",
          "Unggun does not ask for your real name, contact book, precise location, or advertising identifier. It has no public follower graph or algorithmic discovery feed.",
        ],
      },
      {
        title: "Use and sharing",
        paragraphs: [
          "Data is used to provide private-circle chat, room lifecycle, account access, safety operations, and service reliability. It is not sold and is not used for targeted advertising.",
          "Hosting and authentication providers may process the minimum technical data needed to operate their services. Cloud processing only applies when those services are configured and used.",
        ],
      },
      {
        title: "Your controls",
        paragraphs: [
          "You can edit your local profile, clear local activity while keeping that profile, or reset the app from Settings. Resetting local data does not delete a separate cloud account.",
          "Before cloud accounts become the active data source, Unggun will provide an in-app deletion path and publish the corresponding retention details.",
        ],
      },
      {
        title: "Safety and contact",
        paragraphs: [
          "This alpha is intended for adults in invited private circles. Do not use it for emergencies or to store information that must be retained.",
          "Product and privacy questions can be submitted through the public project issue form below. Do not include message content, email addresses, invite links, or other private data.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    effective: "Effective October 21, 2025",
    intro: "These terms apply to the Unggun alpha and its local or cloud-enabled builds.",
    sections: [
      {
        title: "Who may use Unggun",
        paragraphs: [
          "You must be at least 18 years old during the closed alpha and able to agree to these terms. Access may be limited to invited test circles.",
        ],
      },
      {
        title: "Your content and conduct",
        paragraphs: [
          "You keep ownership of content you create. You give Unggun only the permission needed to store, display, transmit, moderate, and delete that content as part of the service.",
          "Do not post illegal content, threats, harassment, exploitation, non-consensual intimate material, private information without permission, spam, or content that infringes another person's rights.",
        ],
      },
      {
        title: "Ephemeral rooms",
        paragraphs: [
          "Room expiry reduces retention inside Unggun; it does not prevent another member from copying, photographing, or sharing what they can see. Do not treat expiry as a guarantee of secrecy.",
          "The alpha may lose or reset data. Keep a separate copy of anything you need to retain.",
        ],
      },
      {
        title: "Accounts and enforcement",
        paragraphs: [
          "You are responsible for access to your email account and device. Unggun may restrict access or remove content to protect people, comply with law, or enforce these terms and the Community Guidelines.",
        ],
      },
      {
        title: "Alpha availability",
        paragraphs: [
          "The service is provided as available during development and may change, pause, or end. Nothing in these terms limits rights that cannot legally be limited.",
        ],
      },
    ],
  },
  guidelines: {
    title: "Community Guidelines",
    effective: "Effective October 21, 2025",
    intro: "Private circles still deserve clear boundaries. These rules apply to every room and interaction.",
    sections: [
      {
        title: "Respect consent and privacy",
        paragraphs: [
          "Share only content you have the right and consent to share. Do not expose someone's private details, impersonate them, or move private-circle content elsewhere without permission.",
        ],
      },
      {
        title: "No abuse or exploitation",
        paragraphs: [
          "Do not threaten, harass, stalk, bully, exploit, or encourage harm. Sexual exploitation, child sexual abuse material, hate-based attacks, and non-consensual intimate content are prohibited.",
        ],
      },
      {
        title: "Keep circles genuine",
        paragraphs: [
          "Do not spam, scam, automate engagement, distribute malware, evade access controls, or use invites to pull strangers into a room without the circle's agreement.",
        ],
      },
      {
        title: "Safety during alpha",
        paragraphs: [
          "In-app report and block controls are not yet connected in this local alpha. Leave an unsafe circle, preserve relevant evidence, contact local emergency services when necessary, and use the support link to report an alpha issue.",
        ],
      },
    ],
  },
};

const licenses = [
  ["React", "MIT", "https://github.com/facebook/react/blob/main/LICENSE"],
  ["Vite", "MIT", "https://github.com/vitejs/vite/blob/main/LICENSE"],
  ["TypeScript", "Apache-2.0", "https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt"],
  ["Supabase JS", "MIT", "https://github.com/supabase/supabase-js/blob/master/LICENSE"],
  ["Capacitor", "MIT", "https://github.com/ionic-team/capacitor/blob/main/LICENSE"],
  ["Lucide", "ISC", "https://github.com/lucide-icons/lucide/blob/main/LICENSE"],
  ["Vitest", "MIT", "https://github.com/vitest-dev/vitest/blob/main/LICENSE"],
] as const;

export function SettingsLegal({ kind }: { kind: LegalPageKind }) {
  if (kind === "licenses") {
    return (
      <article className="legal-page">
        <p className="settings-lead">Unggun uses these open-source projects. Each link opens the project's license text.</p>
        <div className="license-list">
          {licenses.map(([name, license, href]) => (
            <a key={name} href={href} target="_blank" rel="noreferrer">
              <span><strong>{name}</strong><small>{license}</small></span>
              <ExternalLink size={17} aria-hidden="true" />
            </a>
          ))}
        </div>
      </article>
    );
  }

  const document = documents[kind];
  return (
    <article className="legal-page">
      <div className="legal-intro">
        <span>{document.effective}</span>
        <p>{document.intro}</p>
      </div>
      {document.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      <a className="support-link" href={SUPPORT_URL} target="_blank" rel="noreferrer">
        Open public support form <ExternalLink size={16} aria-hidden="true" />
      </a>
    </article>
  );
}