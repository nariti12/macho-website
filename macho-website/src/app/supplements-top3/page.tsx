import { permanentRedirect } from "next/navigation";

export default function SupplementsTop3RedirectPage() {
  permanentRedirect("/supplements-ranking");
}
