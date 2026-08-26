function pad(value) {
  return String(value).padStart(2, "0");
}

/** @param {Date} date */
export function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** @param {Date} date */
export function formatDateTime(date) {
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** @param {string} preset */
export function buildQuickTimeRange(preset) {
  const now = new Date();
  const endTime = formatDateTime(now);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (preset === "today") {
    return { startTime: formatDateTime(start), endTime };
  }
  if (preset === "3days") {
    start.setDate(start.getDate() - 2);
    return { startTime: formatDateTime(start), endTime };
  }
  if (preset === "7days") {
    start.setDate(start.getDate() - 6);
    return { startTime: formatDateTime(start), endTime };
  }
  return { startTime: "", endTime: "" };
}

/**
 * @param {string[] | null | undefined} range
 * @param {{ endAtNow?: boolean }} [options]
 */
export function buildDateRangeTime(range, options = {}) {
  if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
    return { startTime: "", endTime: "" };
  }

  const [startDate, endDate] = range;
  const startTime = `${startDate} 00:00:00`;

  const todayText = formatDate(new Date());
  if (options.endAtNow && endDate === todayText) {
    return { startTime, endTime: formatDateTime(new Date()) };
  }

  return {
    startTime,
    endTime: `${endDate} 23:59:59`,
  };
}

/** @param {{ startTime?: string, endTime?: string }} range */
export function toDatePickerRange(range) {
  const start = String(range?.startTime ?? "").slice(0, 10);
  const end = String(range?.endTime ?? "").slice(0, 10);
  if (!start || !end) return null;
  return [start, end];
}
