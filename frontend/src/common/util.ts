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

// 남은 시간 계산
export const calculateRemainingTime = (endTime: string) => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return "경매 종료";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
};

export const formatPrice = (price?: number) =>
  !price ? "가격 미정" : `${price.toLocaleString()}원`;

export const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return "종료됨";
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainDays = days % 30;
  if (years > 0) {
    if (months > 0) return `${years}년 ${months}개월 후`;
    return `${years}년 후`;
  }
  if (months > 0) {
    if (remainDays > 0) return `${months}개월 ${remainDays}일 후`;
    return `${months}개월 후`;
  }
  if (days > 0) return `${days}일 후`;
  if (hours > 0) return `${hours}시간 후`;
  if (minutes > 0) return `${minutes}분 후`;
  return "곧 종료";
};