type CommerceProvider = "rakuten";

type LinkInput = {
  provider: CommerceProvider;
  affiliateUrl: string | null;
  itemUrl: string;
};

export const buildProductOutboundLink = ({ affiliateUrl, itemUrl }: LinkInput) =>
  affiliateUrl ?? itemUrl;
