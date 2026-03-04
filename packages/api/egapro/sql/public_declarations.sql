SELECT data FROM declaration JOIN search ON declaration.siren=search.siren AND declaration.year=search.year WHERE declaration.year = ANY($1::int[])
