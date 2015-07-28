'use strict';

module.exports = {
   db: 'mongodb://localhost/clique-test',//TODO: add in test database url
   port:3001,
   app:{
      title:'Localight Service - Test environment'
   },
   twilio: {
      accountSID: process.env.ACCOUNT_SID || 'AC3f3d26948bcaffbde196abc45c3e7b89',
       authTOKEN: process.env.AUTH_TOKEN  || 'be441e1b8273e1fe4af1ba78169638b0',
   },
   mailgun: {
      apiKey: 'key-212g0rzf7j9z-n9b7zdl797o3bxrsu38',
      domain: 'https:/.mailgun.net/v3/rs56424.mailgun.org',
   },
   mailer: {
      from: process.env.MAILER_FROM || 'postmaster@rs56424.mailgun.org',
      options: {
         service: process.env.MAILER_SERVICE_PROVIDER || 'mailgun',
         auth: {
            user: process.env.MAILER_EMAIL_ID || 'postmaster@rs56424.mailgun.org',
            pass: process.env.MAILER_PASSWORD || '0z53ixs2b6c4'
         }
      }
   },
   stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_GvAql6HE34rlYwDR3FLSjaHt',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_WHOQeKIKG2CfUsaGl5cAU2Dl',
   }
};
