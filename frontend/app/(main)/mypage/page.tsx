import { auth } from '@/auth';
import { usersControllerGetMe } from '@/generated/openapi-client';
import { redirect } from 'next/navigation';
import ProfileEditor from './ProfileEditor';

export default async function MyPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/signin');
  }

  const { data: user } = await usersControllerGetMe();

  if (!user) redirect('/signin');

  return <ProfileEditor initialUser={user} />;
}
