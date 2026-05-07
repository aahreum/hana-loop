-- ============================================================
-- HanaLoop — Posts 테이블
-- 회사 및 특정 월에 연결된 게시글
-- ============================================================

CREATE TABLE posts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  resource_uid  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date_time     text        NOT NULL CHECK (date_time ~ '^\d{4}-\d{2}$'),  -- "2025-01"
  content       text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_resource_uid  ON posts(resource_uid);
CREATE INDEX idx_posts_date_time     ON posts(date_time);
