import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import GroupRoomCreator from './GroupRoomCreator';

export default async function NewRoomPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/signin');
  }

  return <GroupRoomCreator />;
}
