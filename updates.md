SELECT current_stage AS stage,
       COUNT(*) AS count,
       SUM(CASE WHEN status IN ('At Risk', 'Blocked') THEN 1 ELSE 0 END) AS risk_count
FROM npa_projects
WHERE status != 'Stopped'
GROUP BY current_stage
ORDER BY FIELD(
  current_stage,
  'INITIATION',
  'DISCOVERY',
  'DCE_REVIEW',
  'REVIEW',
  'RISK_ASSESSMENT',
  'PENDING_SIGN_OFFS',
  'SIGN_OFF',
  'PENDING_FINAL_APPROVAL',
  'LAUNCH_PREP',
  'UAT',
  'APPROVED',
  'LAUNCH',
  'LAUNCHED',
  'PIR',
  'MONITORING',
  'PROHIBITED'
);
