export const formatDateTime = (isoString: string | undefined) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  // const sec = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${min}`;
};

export const formatPrice = (price?: number) =>
  !price ? "가격 미정" : `${price.toLocaleString()}원`;

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}일 후`;
  if (hours > 0) return `${hours}시간 후`;
  return "곧 종료";
};