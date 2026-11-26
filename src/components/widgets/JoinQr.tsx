/**
 * widgets/JoinQr.tsx — the plan's public pages as BOUND QR codes and links.
 *
 * @since 2026-11-26 (a QR view asked for its page by an entity the page has no link to and
 *        read „noch nicht veröffentlicht“ over a published page)
 *
 * GENERATED FROM THE PLAN — one component and one hook per public page, already tied to
 * its page. Place it; never name an entity or a slug, never call PublicPageQr or
 * usePublicPageLink yourself for a page listed here:
 *   <EssenBestellenQr size="34vh" />   → #/public/essen-bestellen (one link for everybody)
 * Every component takes the QR's own props (size, showLink, linkClassName …).
 */
import { PublicPageQr, usePublicPageLink, type PublicPageQrProps } from '@/components/widgets/PublicPageQr';

type QrProps = Omit<PublicPageQrProps, 'entity' | 'recordId' | 'page'>;
type ForRecord = QrProps & { recordId: string | null | undefined };

/** „essen-bestellen“ — one link for everybody — Teammitglieder bestellen ohne Login beim Restaurant Hua-Hin, auch per QR-Code erreichbar. Sie sehen die Speisekarte, tragen ihren Namen und eine Bemerkung ein,  */
export function EssenBestellenQr(qr: QrProps) {
  return <PublicPageQr entity="" recordId={null} page="essen-bestellen" {...qr} />;
}
export function useEssenBestellenLink() {
  return usePublicPageLink('', null, 'essen-bestellen');
}
