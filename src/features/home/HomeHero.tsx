import { ArrowRight } from 'lucide-react';
import ImportButtons from '../import/ImportButtons';
import { useSession } from '../session/SessionProvider';
import { appPath, navigate } from '../../lib/navigation';
export default function HomeHero() {
  const { studies } = useSession();
  return (
    <section className="relative z-10 text-center">
      <h1 className="mb-5 text-[clamp(42px,4.9vw,72px)] leading-[1.13] font-normal tracking-[-2px] sm:tracking-[-2.7px]">
        Your studies.
        <br />
        <span className="text-accent">A new perspective.</span>
      </h1>
      <p className="text-[13px] leading-7 text-muted sm:text-[15px]">
        Open and explore your DICOM studies privately in your browser.
      </p>
      <div className="mt-6">
        <ImportButtons />
      </div>
      {studies.length > 0 && (
        <a
          href={appPath('/viewer')}
          onClick={(event) => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            navigate('/viewer');
          }}
          className="mt-5 inline-flex items-center gap-2 text-xs text-accent"
        >
          Continue your session · {studies.length} {studies.length === 1 ? 'study' : 'studies'}
          <ArrowRight size={15} />
        </a>
      )}
    </section>
  );
}
