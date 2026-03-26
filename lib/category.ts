export function categoryLabel(category: string | null | undefined): string {
  switch (category) {
    case "WORKS":
      return "निर्माण कार्य";
    case "SUPPLY":
      return "मालसामान आपूर्ति";
    case "CONSULTING":
      return "परामर्श सेवा";
    case "OTHER":
      return "अन्य कार्य";
    default:
      return category || ""; // Fallback just in case
  }
}