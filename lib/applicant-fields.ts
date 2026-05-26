export function buildApplicantFields(body: Record<string, unknown>) {
  const str  = (k: string): string | null =>
    typeof body[k] === "string" && body[k] ? (body[k] as string).trim() : null;
  const bool = (k: string): boolean | null =>
    body[k] === "yes" ? true : body[k] === "no" ? false : null;
  const num  = (k: string): number | null =>
    body[k] != null && body[k] !== "" ? parseFloat(body[k] as string) || null : null;

  return {
    last_name:          str("last_name"),
    facebook_link:      str("facebook_link"),
    instagram_link:     str("instagram_link"),
    phone:              str("phone"),
    age:                num("age"),
    location:           str("location"),
    sex:                str("sex"),
    married:            bool("married"),
    kids:               bool("kids"),
    device_type:        str("device_type"),
    device_brand:       str("device_brand"),
    internet_provider:  str("internet_provider"),
    current_job_title:  str("current_job_title"),
    years_experience:   str("years_experience"),
    previous_employers: str("previous_employers"),
    skills_tools:       str("skills_tools"),
    software_used:      str("software_used"),
    task_description:   str("task_description"),
    // Assessment
    typing_wpm:         num("typing_wpm"),
    typing_accuracy:    num("typing_accuracy"),
    internet_mbps:      num("internet_mbps"),
  };
}
