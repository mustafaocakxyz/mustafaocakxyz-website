import { supabase } from '../../lib/supabase';
import { buildAuthEmail } from '../constants/authEmail';

const ORGANIZATION_SLUG = 'gelisim';

type RegisterUserInput = {
  loginUsername: string;
  displayName: string;
  password: string;
};

export async function registerUser(input: RegisterUserInput) {
  const loginUsername = input.loginUsername.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const authEmail = buildAuthEmail(loginUsername);

  const { data, error } = await supabase.auth.signUp({
    email: authEmail,
    password: input.password,
    options: {
      data: {
        login_username: loginUsername,
        display_name: displayName,
        role: 'student',
        organization_slug: ORGANIZATION_SLUG,
      },
    },
  });

  if (error) throw error;
  return data;
}
