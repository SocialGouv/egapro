UPDATE declaration SET declarant=lower(declarant) WHERE lower(declarant) != declarant;
DELETE FROM ownership a USING ownership b WHERE a.email > b.email AND a.siren = b.siren AND lower(a.email) = lower(b.email) AND a.email != lower(b.email);
UPDATE ownership SET email=lower(email) WHERE lower(email) != email;
