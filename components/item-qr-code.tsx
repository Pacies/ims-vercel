import QRCode from "react-qr-code";

export default function ItemQRCode({ itemId, itemName }: { itemId: string; itemName: string }) {
  const qrData = JSON.stringify({
    type: "item_update",
    itemId,
    timestamp: Date.now(),
  });

  return (
    <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
      <QRCode value={qrData} size={128} />
      <div style={{ marginTop: 8, textAlign: "center" }}>{itemName}</div>
    </div>
  );
}
