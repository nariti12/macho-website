'use client';

import type { AnchorHTMLAttributes, ReactNode } from "react";

type AffiliateMerchant = "amazon" | "rakuten" | "iherb" | "official";

type AffiliateLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  href: string;
  merchant: AffiliateMerchant;
  productName: string;
  rank?: number;
  placement: string;
  children: ReactNode;
};

export function AffiliateLink({
  href,
  merchant,
  productName,
  rank,
  placement,
  children,
  ...props
}: AffiliateLinkProps) {
  const trackClick = () => {
    const gtag = (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.("event", "affiliate_click", {
      affiliate_merchant: merchant,
      item_name: productName,
      item_rank: rank ?? null,
      link_url: href,
      page_path: window.location.pathname,
      placement,
      transport_type: "beacon",
    });
  };

  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      onClick={trackClick}
    >
      {children}
    </a>
  );
}
