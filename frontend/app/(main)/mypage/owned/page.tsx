import { auth } from '@/auth';
import RoomCard from '@/components/RoomCard';
import CreateRoomCard from '@/components/CreateRoomCard';
import { getMyRooms } from '@/lib/my-rooms';
import { redirect } from 'next/navigation';

export default async function OwnedRoomsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/signin');
  }

  const rooms = await getMyRooms();
  const ownedRooms = rooms.filter(
    (room) => room.type === 'GROUP' && room.myRole === 'OWNER',
  );

  return (
    <div className="grid grid-cols-4 gap-6">
      <CreateRoomCard />
      {ownedRooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
