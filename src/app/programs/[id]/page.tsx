import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProgramDetailsView from '@/components/ProgramDetailsView';
import { getPublicProgram } from '@/lib/publicCatalogue';
import { jsonLd, noIndex, programDescription, publicMetadata, siteUrl } from '@/lib/seo';
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let program;
  try { program = await getPublicProgram(id); }
  catch { return { title: 'Program temporarily unavailable | GradAbroad', robots: noIndex }; }
  if (!program) return { title: 'Program not found | GradAbroad', robots: noIndex };
  return publicMetadata(`${program.course_name} — ${program.university_name} | GradAbroad`, programDescription(program), `/programs/${program.id}`);
}
export default async function ProgramPage({ params }: Props) {
  const { id } = await params, program = await getPublicProgram(id);
  if (!program) notFound();
  const url = `${siteUrl}/programs/${program.id}`;
  const data = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Course', name: program.course_name, description: programDescription(program), url, inLanguage: 'en', educationalLevel: program.level === 'master' ? 'Master’s' : 'Bachelor’s', provider: { '@type': 'CollegeOrUniversity', name: program.university_name } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'GradAbroad', item: siteUrl }, { '@type': 'ListItem', position: 2, name: 'Browse Programs', item: `${siteUrl}/browse-programs` }, { '@type': 'ListItem', position: 3, name: program.course_name, item: url }] },
  ] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} /><ProgramDetailsView program={program} /></>;
}
