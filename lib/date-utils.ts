// D:\Lahan Project APP\client\lib\date-utils.ts
import NepaliDate from "nepali-date-converter";

/**
 * Converts a JavaScript Date object (AD) to a Nepali Date string (BS).
 * Output: "2080-04-01"
 */
export function toNepaliDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";

  try {
    const jsDate = new Date(date);
    const bsDate = new NepaliDate(jsDate);
    return bsDate.format("YYYY-MM-DD"); 
  } catch (e) {
    return "Invalid Date";
  }
}

/**
 * Returns the full Nepali format for certificates.
 * Output: "01 Shrawan 2080" (English Month Name)
 */
export function toFormalNepaliDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  try {
    const jsDate = new Date(date);
    const bsDate = new NepaliDate(jsDate);
    
    // 1. Get the parts
    const day = bsDate.getDate(); // 1-32
    const monthIndex = bsDate.getMonth(); // 0-11
    const year = bsDate.getYear(); // 2080

    // 2. Map Month Index to English Nepali Month Names
    const monthNames = [
      "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", 
      "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
    ];

    // 3. Format: "01 Shrawan 2080"
    const dayString = day < 10 ? `0${day}` : `${day}`;
    const monthString = monthNames[monthIndex];

    return `${dayString} ${monthString} ${year}`; 
  } catch (e) {
    return "Invalid Date";
  }
}

/**
 * Converts a Nepali Date string (YYYY-MM-DD) back to a standard JavaScript Date (AD).
 * Useful for saving BS form inputs into the database.
 */
export function toAdDate(bsDateString: string): Date | null {
  if (!bsDateString) return null;

  try {
    // nepali-date-converter parses "YYYY-MM-DD" or "YYYY/MM/DD"
    const nd = new NepaliDate(bsDateString);
    return nd.toJsDate();
  } catch (e) {
    return null; // Return null if the user hasn't finished typing a valid date
  }
}