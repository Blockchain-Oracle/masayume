import { describe, expect, it } from "vitest";
import { oauth1Header, oauth1Signature, percentEncode, signatureBaseString } from "./oauth1";

/** The worked example from X's own "Creating a signature" guide — every value theirs. */
const DOC = {
  consumerKey: "xvz1evFS4wEEPTGEFPHBog",
  consumerSecret: "kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw",
  accessToken: "370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb",
  accessTokenSecret: "LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE",
};
const NONCE = "kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg";
const TIMESTAMP = 1318622958;
const PARAMS = {
  include_entities: "true",
  status: "Hello Ladies + Gentlemen, a signed OAuth request!",
  oauth_consumer_key: DOC.consumerKey,
  oauth_nonce: NONCE,
  oauth_signature_method: "HMAC-SHA1",
  oauth_timestamp: String(TIMESTAMP),
  oauth_token: DOC.accessToken,
  oauth_version: "1.0",
};

describe("oauth1", () => {
  it("percent-encodes the way OAuth wants, not the way encodeURIComponent does", () => {
    expect(percentEncode("Hello Ladies + Gentlemen, a signed OAuth request!")).toBe("Hello%20Ladies%20%2B%20Gentlemen%2C%20a%20signed%20OAuth%20request%21");
    expect(percentEncode("a*b'c(d)e!")).toBe("a%2Ab%27c%28d%29e%21");
  });

  it("reproduces the guide's base string", () => {
    const base = signatureBaseString({ method: "POST", baseUrl: "https://api.twitter.com/1.1/statuses/update.json", params: PARAMS, nonce: NONCE, timestampSec: TIMESTAMP });
    expect(base).toBe(
      "POST&https%3A%2F%2Fapi.twitter.com%2F1.1%2Fstatuses%2Fupdate.json&include_entities%3Dtrue%26oauth_consumer_key%3Dxvz1evFS4wEEPTGEFPHBog%26oauth_nonce%3DkYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1318622958%26oauth_token%3D370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb%26oauth_version%3D1.0%26status%3DHello%2520Ladies%2520%252B%2520Gentlemen%252C%2520a%2520signed%2520OAuth%2520request%2521",
    );
  });

  it("reproduces the guide's signature", () => {
    expect(oauth1Signature(DOC, { method: "POST", baseUrl: "https://api.twitter.com/1.1/statuses/update.json", params: PARAMS, nonce: NONCE, timestampSec: TIMESTAMP })).toBe("hCtSmYh+iHYCEqBWrE7C7hYmtUk=");
  });

  it("builds the header with the same signature, sorted, quoted", () => {
    const header = oauth1Header(DOC, "POST", "https://api.twitter.com/1.1/statuses/update.json", { include_entities: "true", status: "Hello Ladies + Gentlemen, a signed OAuth request!" }, { nonce: NONCE, timestampSec: TIMESTAMP });
    expect(header.startsWith("OAuth oauth_consumer_key=\"xvz1evFS4wEEPTGEFPHBog\"")).toBe(true);
    expect(header).toContain('oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"');
    expect(header).toContain('oauth_version="1.0"');
  });

  it("signs a JSON POST over the oauth parameters alone", () => {
    const header = oauth1Header(DOC, "POST", "https://api.x.com/2/tweets", {}, { nonce: NONCE, timestampSec: TIMESTAMP });
    const expected = oauth1Signature(DOC, {
      method: "POST",
      baseUrl: "https://api.x.com/2/tweets",
      params: { oauth_consumer_key: DOC.consumerKey, oauth_nonce: NONCE, oauth_signature_method: "HMAC-SHA1", oauth_timestamp: String(TIMESTAMP), oauth_token: DOC.accessToken, oauth_version: "1.0" },
      nonce: NONCE,
      timestampSec: TIMESTAMP,
    });
    expect(header).toContain(`oauth_signature="${percentEncode(expected)}"`);
  });
});
