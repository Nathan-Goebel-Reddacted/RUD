import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Modal from "@/components/tool/Modal";
import { useTranslation } from "react-i18next";
import type Profile from "@/class/Profiles";
import type ApiConnection from "@/class/ApiConnection";
import type { Dashboard } from "@/types/widget";
import {
  encodeProfileToQR,
  buildQRUrl,
  QR_WARN_BYTES,
  QR_MAX_BYTES,
} from "@/services/profileQR";

type Props = {
  profile:     Profile;
  connections: ApiConnection[];
  dashboards:  Dashboard[];
  modalId:     string;
  openCount:   number;
};

export default function QRCodeModal({ profile, connections, dashboards, modalId, openCount }: Props) {
  const { t } = useTranslation();
  const [qrData, setQrData] = useState<{ data: string; sizeBytes: number; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (openCount === 0) return;
    const { data, sizeBytes } = encodeProfileToQR(profile, connections, dashboards);
    setQrData({ data, sizeBytes, url: buildQRUrl(data) });
  }, [openCount]); // eslint-disable-line react-hooks/exhaustive-deps -- recalculate only on open

  useEffect(() => {
    return () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current); };
  }, []);

  async function handleCopy() {
    if (!qrData) return;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(qrData.url).catch(() => fallbackCopy(qrData.url));
    } else {
      fallbackCopy(qrData.url);
    }
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  const tooBig  = qrData ? qrData.sizeBytes > QR_MAX_BYTES  : false;
  const warning = qrData ? qrData.sizeBytes > QR_WARN_BYTES : false;
  const sizeKb  = qrData ? (qrData.sizeBytes / 1024).toFixed(1) : "0";

  return (
    <Modal id={modalId} width={340} ariaLabelledBy="qr-modal-title">
      <h3 id="qr-modal-title">{t("qrModal.title")}</h3>
      {qrData && (
        <>
          {tooBig ? (
            <p className="form-error">{t("qrModal.errorSize", { size: sizeKb })}</p>
          ) : (
            <>
              {warning && <p className="form-warning">{t("qrModal.warnSize", { size: sizeKb })}</p>}
              <QRCodeSVG value={qrData.url} size={300} level="L" />
            </>
          )}
          <p className="qr-size-info">{t("qrModal.sizeInfo", { size: sizeKb })}</p>
          <button className="nav-btn" onClick={handleCopy}>
            {copied ? t("qrModal.copied") : t("qrModal.copyLink")}
          </button>
        </>
      )}
    </Modal>
  );
}

function fallbackCopy(text: string) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}
