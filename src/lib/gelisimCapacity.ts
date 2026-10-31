import { useEffect, useState } from 'react';
import { fetchPublicActiveStudentCount } from './fetchPublicStudentCount';

export const GELISIM_CAPACITY = 40;

export const GELISIM_CAPACITY_FULL_MESSAGE =
  'Şu anda bütün kontenjanlarımız dolu. İlgilendiğin için teşekkürler.';

export function gelisimCapacityPillLabel(studentCount: number | null): string {
  if (studentCount === null) {
    return `KONTENJAN DOLUYOR … / ${GELISIM_CAPACITY}`;
  }

  const shown = Math.min(studentCount, GELISIM_CAPACITY);
  if (studentCount >= GELISIM_CAPACITY) {
    return `KONTENJAN DOLU ${shown} / ${GELISIM_CAPACITY}`;
  }

  return `KONTENJAN DOLUYOR ${shown} / ${GELISIM_CAPACITY}`;
}

export function useGelisimCapacity() {
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    void fetchPublicActiveStudentCount()
      .then((count) => {
        if (isMounted) setStudentCount(count);
      })
      .catch(() => {
        if (isMounted) setStudentCount(0);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isFull = studentCount !== null && studentCount >= GELISIM_CAPACITY;

  return {
    studentCount,
    capacity: GELISIM_CAPACITY,
    isFull,
    isLoading: studentCount === null,
    applicationsOpen: studentCount !== null && !isFull,
    pillLabel: gelisimCapacityPillLabel(studentCount),
  };
}
