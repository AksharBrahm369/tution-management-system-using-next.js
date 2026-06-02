import { redirect } from 'next/navigation';

export default function NewExamRedirect() {
  redirect('/admin/exams/create');
}
