import { redirect } from 'next/navigation';

export default function NewTeacherRedirect() {
  redirect('/admin/teachers/add');
}
