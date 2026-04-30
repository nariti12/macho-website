type CommerceProvider = "rakuten";

type LinkInput = {
  provider: CommerceProvider;
  affiliateUrl: string | null;
  itemUrl: string;
};

const AMAZON_ASSOCIATE_TAG = "machoda-22";

export const buildRakutenAffiliateUrl = (url: string) => {
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  if (!affiliateId) return url;
  if (url.startsWith("https://hb.afl.rakuten.co.jp/")) return url;
  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(url)}&link_type=text`;
};

export const buildAmazonAffiliateUrl = (url: string) => {
  const amazonUrl = new URL(url);
  amazonUrl.searchParams.set("tag", AMAZON_ASSOCIATE_TAG);
  return amazonUrl.toString();
};

export const buildProductOutboundLink = ({ affiliateUrl, itemUrl }: LinkInput) => affiliateUrl ?? itemUrl;
