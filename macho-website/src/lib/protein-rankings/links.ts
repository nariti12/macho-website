type CommerceProvider = "rakuten";

type LinkInput = {
  provider: CommerceProvider;
  affiliateUrl: string | null;
  itemUrl: string;
};

export const buildRakutenAffiliateUrl = (url: string) => {
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  if (!affiliateId) return url;
  return `${url}${url.includes("?") ? "&" : "?"}scid=af_pc_etc&sc2id=${affiliateId}`;
};

export const buildProductOutboundLink = ({ affiliateUrl, itemUrl }: LinkInput) => affiliateUrl ?? itemUrl;
