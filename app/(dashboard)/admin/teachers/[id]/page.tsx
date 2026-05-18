import React from 'react';
import TeacherProfilePage from '@/components/admin/teachers/TeacherProfile/TeacherProfilePage';

export default async function TeacherProfileRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TeacherProfilePage teacherId={id} />;
}
