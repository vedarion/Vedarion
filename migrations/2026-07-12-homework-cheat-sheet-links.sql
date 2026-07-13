-- One-time backfill: add a [Cheat Sheet](<lesson-url>) resource link to existing
-- homework rows whose label starts with 'Review Lesson:' or 'Drill:' and whose
-- description is missing the link.
--
-- Why: HW_CARDS descriptions are copied into homework rows at INSERT time, so rows
-- created before the QT_DRILLS lesson URLs were populated are missing the link.
-- Fixing the templates only affects future cards; this backfills the old rows.
--
-- Scope: only the 9 question types with a live lesson page are listed below.
-- Lesson pages verified 2026-07-12 (HTTP 200 + real content):
--   main-point, argument-part, method-of-reasoning, must-be-true,
--   most-strongly-supported, sufficient-assumption, necessary-assumption,
--   strengthen-weaken, flaw
-- Intentionally omitted: parallel-reasoning -> /lesson is a real 404, so there is
-- no Cheat Sheet to link. Agree/Disagree, Evaluate, Resolve/Reconcile/Explain have
-- no lesson page either and are not QT_DRILLS card types.
--
-- Safety:
--   * Only rows that already contain a '--Resources:' section are touched, so the
--     appended line always lands under Resources (the last section in both the
--     lessonCardDesc and qtCardDesc templates).
--   * Idempotent: the NOT LIKE '%<url>%' guard skips rows that already have the
--     lesson link (including legacy '[Cheat Sheet / Lesson](<url>)' drill rows).
--
-- >>> RUN THE PREVIEW (Step 1) FIRST and eyeball the rows before running Step 2. <<<


-- ============================================================================
-- STEP 1 — PREVIEW (read-only). Lists every row that Step 2 would modify.
-- ============================================================================
SELECT h.id, h.label, m.url AS cheat_sheet_to_append
FROM homework AS h
JOIN (VALUES
  ('Main Point',              'https://vedarion.com/question-types/main-point/lesson'),
  ('Argument Part',           'https://vedarion.com/question-types/argument-part/lesson'),
  ('Method of Reasoning',     'https://vedarion.com/question-types/method-of-reasoning/lesson'),
  ('Must Be True',            'https://vedarion.com/question-types/must-be-true/lesson'),
  ('Most Strongly Supported', 'https://vedarion.com/question-types/most-strongly-supported/lesson'),
  ('Sufficient Assumption',   'https://vedarion.com/question-types/sufficient-assumption/lesson'),
  ('Necessary Assumption',    'https://vedarion.com/question-types/necessary-assumption/lesson'),
  ('Strengthen & Weaken',     'https://vedarion.com/question-types/strengthen-weaken/lesson'),
  ('Flaw',                    'https://vedarion.com/question-types/flaw/lesson')
) AS m(name, url)
  ON (h.label = 'Review Lesson: ' || m.name OR h.label = 'Drill: ' || m.name)
WHERE h.description IS NOT NULL
  AND h.description LIKE '%--Resources:%'
  AND h.description NOT LIKE '%' || m.url || '%'
ORDER BY h.label;


-- ============================================================================
-- STEP 2 — APPLY. Appends the Cheat Sheet line under Resources.
-- Run inside a transaction so you can ROLLBACK if the row count looks wrong.
-- ============================================================================
-- BEGIN;

UPDATE homework AS h
SET description = h.description || E'\n[Cheat Sheet](' || m.url || ')'
FROM (VALUES
  ('Main Point',              'https://vedarion.com/question-types/main-point/lesson'),
  ('Argument Part',           'https://vedarion.com/question-types/argument-part/lesson'),
  ('Method of Reasoning',     'https://vedarion.com/question-types/method-of-reasoning/lesson'),
  ('Must Be True',            'https://vedarion.com/question-types/must-be-true/lesson'),
  ('Most Strongly Supported', 'https://vedarion.com/question-types/most-strongly-supported/lesson'),
  ('Sufficient Assumption',   'https://vedarion.com/question-types/sufficient-assumption/lesson'),
  ('Necessary Assumption',    'https://vedarion.com/question-types/necessary-assumption/lesson'),
  ('Strengthen & Weaken',     'https://vedarion.com/question-types/strengthen-weaken/lesson'),
  ('Flaw',                    'https://vedarion.com/question-types/flaw/lesson')
) AS m(name, url)
WHERE (h.label = 'Review Lesson: ' || m.name OR h.label = 'Drill: ' || m.name)
  AND h.description IS NOT NULL
  AND h.description LIKE '%--Resources:%'
  AND h.description NOT LIKE '%' || m.url || '%';

-- COMMIT;
