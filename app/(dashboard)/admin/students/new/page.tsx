import { redirect } from 'next/navigation';

export default function NewStudentRedirect() {
  redirect('/admin/students/add');
}
