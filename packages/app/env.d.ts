// Auto-generated with "generateEnvDeclaration" script
/* eslint-disable */
declare namespace NodeJS {
    interface ProcessEnv {
        /**
         * Dist: `https://egapro-preprod.dev.fabrique.social.gouv.fr/api`  
         * {@link [Local Env Dist](.env.development)}
         */
        NEXT_PUBLIC_API_URL?: string;
        /**
         * Dist: `<dev>`  
         * {@link [Local Env Dist](.env.development)}
         */
        NEXT_PUBLIC_MATOMO_URL?: string;
        /**
         * Dist: `<dev>`  
         * {@link [Local Env Dist](.env.development)}
         */
        NEXT_PUBLIC_MATOMO_SITE_ID?: string;
        /**
         * Dist: `false`  
         * {@link [Local Env Dist](.env.development)}
         */
        MAILER_ENABLE?: string;
        /**
         * Dist: `127.0.0.1`  
         * {@link [Local Env Dist](.env.development)}
         */
        MAILER_SMTP_HOST?: string;
        /**
         * Dist: `1025`  
         * {@link [Local Env Dist](.env.development)}
         */
        MAILER_SMTP_PORT?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        MAILER_SMTP_PASSWORD?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        MAILER_SMTP_LOGIN?: string;
        /**
         * Dist: `false`  
         * {@link [Local Env Dist](.env.development)}
         */
        MAILER_SMTP_SSL?: string;
        /**
         * Dist: `EgaPro <index@travail.gouv.fr>`  
         * {@link [Local Env Dist](.env.development)}
         */
        MAILER_FROM_EMAIL?: string;
        /**
         * Dist: `Egapro`  
         * {@link [Local Env Dist](.env.development)}
         */
        MAILER_EMAIL_SIGNATURE?: string;
        /**
         * Dist: `postgres`  
         * {@link [Local Env Dist](.env.development)}
         */
        POSTGRES_USER?: string;
        /**
         * Dist: `postgres`  
         * {@link [Local Env Dist](.env.development)}
         */
        POSTGRES_PASSWORD?: string;
        /**
         * Dist: `egapro`  
         * {@link [Local Env Dist](.env.development)}
         */
        POSTGRES_DB?: string;
        /**
         * Dist: `5438`  
         * {@link [Local Env Dist](.env.development)}
         */
        POSTGRES_PORT?: string;
        /**
         * Dist: `localhost`  
         * {@link [Local Env Dist](.env.development)}
         */
        POSTGRES_HOST?: string;
        /**
         * Dist: `prefer`  
         * {@link [Local Env Dist](.env.development)}
         */
        POSTGRES_SSLMODE?: string;
        /**
         * Dist: `2`  
         * {@link [Local Env Dist](.env.development)}
         */
        POSTGRES_POOL_MIN_SIZE?: string;
        /**
         * Dist: `10`  
         * {@link [Local Env Dist](.env.development)}
         */
        POSTGRES_POOL_MAX_SIZE?: string;
        /**
         * Dist: `false`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRRO_READONLY?: string;
        /**
         * Dist: `https://index-egapro.travail.gouv.fr`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRRO_DOMAIN?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRRO_STAFF?: string;
        /**
         * Dist: `false`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_USE_API_ENTREPRISE?: string;
        /**
         * Dist: `https://entreprise.api.gouv.fr/v2/`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRRO_API_ENTREPRISES_URL?: string;
        /**
         * Dist: `https://api.recherche-entreprises.fabrique.social.gouv.fr/api/v1/`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRRO_API_RECHERCHE_ENTREPRISES_URL?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRRO_BASE_URL?: string;
        /**
         * Dist: `Egapro`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRRO_SITE_DESCRIPTION?: string;
        /**
         * Dist: `*`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRRO_ALLOW_ORIGIN?: string;
        /**
         * Dist: `sikretfordevonly`  
         * {@link [Local Env Dist](.env.development)}
         */
        SECURITY_JWT_SECRET?: string;
        /**
         * Dist: `HS256`  
         * {@link [Local Env Dist](.env.development)}
         */
        SECURITY_JWT_ALGORITHM?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        SECURITY_ALLOWED_IPS?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        SENTRY_DSN?: string;
        /**
         * Dist: `local`  
         * {@link [Local Env Dist](.env.development)}
         */
        SENTRY_ENVIRONMENT?: string;
    }
}
declare type ProcessEnvCustomKeys = 
    | 'NEXT_PUBLIC_API_URL'
    | 'NEXT_PUBLIC_MATOMO_URL'
    | 'NEXT_PUBLIC_MATOMO_SITE_ID'
    | 'MAILER_ENABLE'
    | 'MAILER_SMTP_HOST'
    | 'MAILER_SMTP_PORT'
    | 'MAILER_SMTP_PASSWORD'
    | 'MAILER_SMTP_LOGIN'
    | 'MAILER_SMTP_SSL'
    | 'MAILER_FROM_EMAIL'
    | 'MAILER_EMAIL_SIGNATURE'
    | 'POSTGRES_USER'
    | 'POSTGRES_PASSWORD'
    | 'POSTGRES_DB'
    | 'POSTGRES_PORT'
    | 'POSTGRES_HOST'
    | 'POSTGRES_SSLMODE'
    | 'POSTGRES_POOL_MIN_SIZE'
    | 'POSTGRES_POOL_MAX_SIZE'
    | 'EGAPRRO_READONLY'
    | 'EGAPRRO_DOMAIN'
    | 'EGAPRRO_STAFF'
    | 'EGAPRO_USE_API_ENTREPRISE'
    | 'EGAPRRO_API_ENTREPRISES_URL'
    | 'EGAPRRO_API_RECHERCHE_ENTREPRISES_URL'
    | 'EGAPRRO_BASE_URL'
    | 'EGAPRRO_SITE_DESCRIPTION'
    | 'EGAPRRO_ALLOW_ORIGIN'
    | 'SECURITY_JWT_SECRET'
    | 'SECURITY_JWT_ALGORITHM'
    | 'SECURITY_ALLOWED_IPS'
    | 'SENTRY_DSN'
    | 'SENTRY_ENVIRONMENT';