import Link from 'next/link';
import type { ReactNode } from 'react';

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="mt-8 text-headline text-label">{children}</h2>
);

const P = ({ children }: { children: ReactNode }) => (
  <p className="mt-3 text-body text-label-secondary">{children}</p>
);

const Try = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="font-semibold text-tint-text underline underline-offset-2">
    {children}
  </Link>
);

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded-xs bg-fill px-1 font-mono text-mono-small text-mono-text">
    {children}
  </code>
);

export function EncodingIsNotEncryption() {
  return (
    <>
      <P>
        Base64 output looks scrambled, so it is easy to mistake it for a secret. It isn&apos;t.
        Encoding, encryption and hashing all turn text into something that looks like noise, but
        they do three very different jobs.
      </P>

      <H2>Encoding changes the form</H2>
      <P>
        Encoding rewrites data so it can travel where raw bytes can&apos;t: inside an email, a URL
        or a JSON document. Base64 and hex are encodings. There is no key and no secret: the rules
        are public, and anyone can reverse them in a second. <Code>Hello</Code> in Base64 is
        always <Code>SGVsbG8=</Code>, for everyone.
      </P>
      <P>
        Try it: <Try href="/algorithms/base64">encode something with Base64</Try>, then press
        &ldquo;Use as input&rdquo; and decode it back. Nothing was hidden along the way.
      </P>

      <H2>Encryption needs a key</H2>
      <P>
        Encryption hides the meaning of a message from anyone who lacks the key. Without it, the
        output is useless; with it, the original comes back exactly. Modern ciphers such as
        AES-256-GCM also detect tampering: change one character of the ciphertext and decryption
        fails instead of returning garbage.
      </P>
      <P>
        Try it: <Try href="/algorithms/aes-256-gcm">encrypt a sentence with AES-256-GCM</Try>,
        then decrypt it with a different password. It refuses.
      </P>

      <H2>Hashing is one-way</H2>
      <P>
        A hash such as SHA-256 turns any text into a fixed-size fingerprint. The same text always
        gives the same fingerprint, a tiny change gives a completely different one, and there is
        no way back to the text. That makes hashes good for checking that two things are equal,
        not for keeping secrets you need to read again.
      </P>

      <H2>The short version</H2>
      <P>
        Encoding is for transport and anyone can undo it. Encryption is for secrecy and needs a
        key. Hashing is for fingerprints and nobody can undo it. If something only looks
        scrambled, ask which of the three it is before you trust it with a secret.
      </P>
    </>
  );
}
