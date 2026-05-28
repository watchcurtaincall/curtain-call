const { Resend } = require('resend');
const resend = new Resend('re_fLPLW2fz_BLB6yojFFescsw2wTRUPopBa');

async function test() {
  const { data, error } = await resend.emails.list ? resend.emails.list() : { error: 'No list method' };
  console.log(data || error);
}
test();
