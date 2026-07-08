const leadingListIcons =
  /^(?:\s*(?:✓|✔|✅|❌|✕|✖|✗|×|⚠️?|→))+\s*/u;

export const stripLeadingIcon = (value: string) =>
  value.replace(leadingListIcons, "");
