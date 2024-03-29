// Auto-generated with "generateEnvDeclaration" script
/* eslint-disable */
declare namespace NodeJS {
    interface ProcessEnv {
        /**
         * Dist: `next`  
         * {@link [Local Env Dist](.env.development)}
         */
        __NEXT_PRIVATE_PREBUNDLED_REACT?: string;
        /**
         * Dist: `http://localhost:2626`  
         * {@link [Local Env Dist](.env.development)}
         */
        NEXT_PUBLIC_API_URL?: string;
        /**
         * Dist: `http://localhost:3000/api`  
         * {@link [Local Env Dist](.env.development)}
         */
        NEXT_PUBLIC_API_V2_URL?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        NEXT_PUBLIC_MATOMO_URL?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        NEXT_PUBLIC_MATOMO_SITE_ID?: string;
        /**
         * Dist: `<dev>`  
         * {@link [Local Env Dist](.env.development)}
         */
        NEXT_PUBLIC_GITHUB_SHA?: string;
        /**
         * Dist: `http://localhost:3000/api/auth`  
         * {@link [Local Env Dist](.env.development)}
         */
        NEXTAUTH_URL?: string;
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
         * Dist: `L'équipe Egapro`  
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
         * Dist: `dev`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_ENV?: string;
        /**
         * Dist: `false`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_READONLY?: string;
        /**
         * Dist: `https://index-egapro.travail.gouv.fr`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_DOMAIN?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_STAFF?: string;
        /**
         * Dist: `false`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_USE_API_ENTREPRISE?: string;
        /**
         * Dist: `https://entreprise.api.gouv.fr/v2/`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_API_ENTREPRISES_URL?: string;
        /**
         * Dist: `https://api.recherche-entreprises.fabrique.social.gouv.fr/api/v1/`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_API_RECHERCHE_ENTREPRISES_URL?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_BASE_URL?: string;
        /**
         * Dist: `Egapro`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_SITE_DESCRIPTION?: string;
        /**
         * Dist: `*`  
         * {@link [Local Env Dist](.env.development)}
         */
        EGAPRO_ALLOW_ORIGIN?: string;
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
        SECURITY_MONCOMPTEPRO_CLIENT_ID?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        SECURITY_MONCOMPTEPRO_CLIENT_SECRET?: string;
        /**
         * Dist: `true`  
         * {@link [Local Env Dist](.env.development)}
         */
        SECURITY_MONCOMPTEPRO_TEST?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        SECURITY_GITHUB_CLIENT_ID?: string;
        /**
         * No dist value.  
         * {@link [Local Env Dist](.env.development)}
         */
        SECURITY_GITHUB_CLIENT_SECRET?: string;
        /**
         * Dist: `https://egapro-charon.ovh.fabrique.social.gouv.fr`  
         * {@link [Local Env Dist](.env.development)}
         */
        SECURITY_CHARON_URL?: string;
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
    | '__NEXT_PRIVATE_PREBUNDLED_REACT'
    | 'NEXT_PUBLIC_API_URL'
    | 'NEXT_PUBLIC_API_V2_URL'
    | 'NEXT_PUBLIC_MATOMO_URL'
    | 'NEXT_PUBLIC_MATOMO_SITE_ID'
    | 'NEXT_PUBLIC_GITHUB_SHA'
    | 'NEXTAUTH_URL'
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
    | 'EGAPRO_ENV'
    | 'EGAPRO_READONLY'
    | 'EGAPRO_DOMAIN'
    | 'EGAPRO_STAFF'
    | 'EGAPRO_USE_API_ENTREPRISE'
    | 'EGAPRO_API_ENTREPRISES_URL'
    | 'EGAPRO_API_RECHERCHE_ENTREPRISES_URL'
    | 'EGAPRO_BASE_URL'
    | 'EGAPRO_SITE_DESCRIPTION'
    | 'EGAPRO_ALLOW_ORIGIN'
    | 'SECURITY_JWT_SECRET'
    | 'SECURITY_JWT_ALGORITHM'
    | 'SECURITY_ALLOWED_IPS'
    | 'SECURITY_MONCOMPTEPRO_CLIENT_ID'
    | 'SECURITY_MONCOMPTEPRO_CLIENT_SECRET'
    | 'SECURITY_MONCOMPTEPRO_TEST'
    | 'SECURITY_GITHUB_CLIENT_ID'
    | 'SECURITY_GITHUB_CLIENT_SECRET'
    | 'SECURITY_CHARON_URL'
    | 'SENTRY_DSN'
    | 'SENTRY_ENVIRONMENT';
