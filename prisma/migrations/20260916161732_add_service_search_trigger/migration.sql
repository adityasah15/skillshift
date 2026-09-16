CREATE OR REPLACE FUNCTION update_service_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(
      to_tsvector('english', coalesce(array_to_string(NEW.skills, ' '), '')),
      'C'
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, description, skills
ON "Service"
FOR EACH ROW
EXECUTE FUNCTION update_service_search_vector();