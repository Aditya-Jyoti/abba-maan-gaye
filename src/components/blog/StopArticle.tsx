import Link from "next/link";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { EditableText } from "@/components/editor/EditableText";
import type { EditApi, Path } from "@/components/editor/api";
import { AddPhotos, PhotoSlot } from "@/components/editor/PhotoSlot";
import { AddButton, Inserter, ItemTools } from "@/components/editor/Tools";
import { InlineText } from "@/components/InlineText";
import { Photo } from "@/components/Photo";
import type { Photo as PhotoData, StoryBlock } from "@/db/schema";
import type { Viewer } from "@/lib/auth/session";
import type { StopPage } from "@/lib/content";
import { homeHref, stateHref } from "@/lib/routes";
import { CloseOnOutside } from "./CloseOnOutside";
import { EditBar } from "./EditBar";
import styles from "./StopArticle.module.css";

const GALLERY_TILT = [-2.2, 1.6, -1.2, 2.4, -1.8, 1.1];
const SEE_TILT = [-2, 1.5, -1, 2];

type Props = {
  page: StopPage;
  /** The signed-in editor, if any. Visitors get no editing controls. */
  viewer: Viewer | null;
  /** Present on the edit page: every part of the post becomes editable. */
  edit?: EditApi;
  /** Replaces the floating editor bar (the edit page brings its own). */
  bar?: ReactNode;
};

/** A stop's post: header nav, hero, trip notes, story, sights, food and photos. */
export function StopArticle({ page, viewer, edit, bar }: Props) {
  const { trip, stop, nav } = page;
  const hero = stop.photos[0] ?? null;
  const second = stop.photos[4] ?? null;
  const showNotes = stop.details.length > 0 || edit;
  const showSee = stop.see.length > 0 || edit;
  const showEat = stop.eat.length > 0 || edit;
  const showRoll = stop.photos.length > 0 || edit;

  return (
    <div data-screen-label="Blog" className={edit ? styles.editing : undefined}>
      <header className={styles.header}>
        <div className={styles.headerPill}>
          <Link href={homeHref} scroll={false} className={styles.mapButton}>
            <span className={styles.chevron} />
            Map
          </Link>
          <nav className={styles.stopsNav} aria-label={`Stops on ${trip.title}`}>
            {nav.map((n, i) => (
              <div key={n.slug} className={styles.navItem}>
                <Link
                  href={n.href}
                  scroll={false}
                  className={styles.navLink}
                  aria-current={n.active ? "page" : undefined}
                >
                  <span className={n.active ? styles.navDotActive : styles.navDot} />
                  <span className={styles.navText}>
                    <span className={styles.navDate}>{n.date}</span>
                    <span className={styles.navName}>{n.name}</span>
                  </span>
                </Link>
                {i < nav.length - 1 && <span className={styles.navJoin} />}
              </div>
            ))}
          </nav>

          {/* Phones: the current stop, with the whole timeline behind a menu button.
              Keyed by stop so it closes after picking another day; a tap outside closes it too. */}
          <details key={stop.slug} className={styles.stopsMenu}>
            <summary className={styles.menuSummary} aria-label={`Stops on ${trip.title}`}>
              <span className={styles.navText}>
                <span className={styles.navDate}>
                  Stop {stop.n} of {stop.total}
                </span>
                <span className={styles.navName}>{stop.name}</span>
              </span>
              <span className={styles.burger} aria-hidden>
                <span />
              </span>
            </summary>
            <nav className={styles.menuPanel} aria-label={`Stops on ${trip.title}`}>
              <span className={styles.menuTrip}>{trip.title}</span>
              {nav.map((n) => (
                <Link
                  key={n.slug}
                  href={n.href}
                  scroll={false}
                  className={styles.menuLink}
                  aria-current={n.active ? "page" : undefined}
                >
                  <span className={n.active ? styles.navDotActive : styles.navDot} />
                  <span className={styles.navText}>
                    <span className={styles.navDate}>{n.date}</span>
                    <span className={styles.navName}>{n.name}</span>
                  </span>
                </Link>
              ))}
            </nav>
            <CloseOnOutside />
          </details>
        </div>
      </header>

      <article className={styles.article}>
        <div className={styles.hero}>
          <div className={styles.heroText}>
            <span className={styles.badge}>
              Stop {stop.n} of {stop.total}, {stop.name}
            </span>
            <Text edit={edit} path={["title"]} value={stop.title} as="h1" className={styles.title} label="Title" placeholder={stop.name} />
            {(stop.dek || edit) && (
              <Text
                edit={edit}
                path={["dek"]}
                value={stop.dek}
                as="p"
                className={styles.dek}
                label="Summary"
                placeholder="Add a one-line summary"
              />
            )}
            {(stop.dateLong || stop.nights) && (
              <span className={styles.when}>
                {[stop.dateLong, stop.nights ? `${stop.nights} ${stop.nights === 1 ? "night" : "nights"}` : ""]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}
          </div>
          <div className={styles.heroPhotos}>
            <div className={styles.heroMain}>
              <Pic
                edit={edit}
                path={["photos", 0]}
                photo={hero}
                onEmpty={(p) => edit?.insert(["photos"], 0, p)}
                label={hero ? `hero photo: ${hero.caption}` : "hero photo"}
                stripe={9}
                sizes="380px"
                className={styles.heroImage}
              />
              <div className={styles.heroCaption}>
                {hero && <Text edit={edit} path={["photos", 0, "caption"]} value={hero.caption} label="Hero photo caption" placeholder="Caption" />}
              </div>
            </div>
            {second && (
              <div className={styles.heroSmall}>
                <Pic edit={edit} path={["photos", 4]} photo={second} caption={false} sizes="200px" style={{ height: 120 }} />
                <div className={styles.heroSmallCaption}>
                  <Text edit={edit} path={["photos", 4, "caption"]} value={second.caption} label="Second photo caption" placeholder="Caption" />
                </div>
              </div>
            )}
            <div className={styles.heroTape} />
          </div>
          {edit && <p className={styles.editHint}>The first camera-roll photo is the hero, and the fifth is the small one beside it.</p>}
        </div>

        {showNotes && (
          <div className={styles.notes}>
            {stop.details.map((d, i) => (
              <div key={i} className={styles.note}>
                <Text edit={edit} path={["details", i, "label"]} value={d.label} className={styles.noteLabel} label="Note label" placeholder="Label" />
                <Text edit={edit} path={["details", i, "value"]} value={d.value} className={styles.noteValue} label="Note" placeholder="Value" />
                {edit && (
                  <ItemTools
                    noun="note"
                    index={i}
                    count={stop.details.length}
                    sideways
                    onMove={(to) => edit.move(["details"], i, to)}
                    onRemove={() => edit.remove(["details"], i)}
                  />
                )}
              </div>
            ))}
            {edit && (
              <div className={styles.note}>
                <AddButton onClick={() => edit.insert(["details"], stop.details.length, { label: "", value: "" })}>Add a trip note</AddButton>
              </div>
            )}
            <div className={styles.notesTab}>TRIP NOTES</div>
          </div>
        )}

        <div className={styles.story}>
          {stop.story.map((b, i) =>
            edit ? (
              <div key={edit.blockIds[i]} className={styles.blockWrap} data-block={edit.blockIds[i]}>
                <Inserter onPick={(type) => edit.addBlock(i, type)} />
                <ItemTools
                  noun="block"
                  index={i}
                  count={stop.story.length}
                  type={b.type}
                  onConvert={(type) => edit.convertBlock(i, type)}
                  onMove={(to) => edit.move(["story"], i, to)}
                  onRemove={() => edit.remove(["story"], i)}
                />
                <Block block={b} edit={edit} index={i} />
              </div>
            ) : (
              <Block key={i} block={b} index={i} />
            ),
          )}
          {edit ? (
            <Inserter always onPick={(type) => edit.addBlock(stop.story.length, type)} />
          ) : (
            !stop.story.length && <p className={styles.paragraph}>The story of this stop hasn&apos;t been written yet.</p>
          )}
        </div>

        {showSee && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionTitle}>What you can see around {stop.name}</h3>
              <span className={styles.sectionNote}>Everything we actually did</span>
            </div>
            <div className={styles.seeGrid}>
              {stop.see.map((x, i) => (
                <div
                  key={i}
                  className={styles.seeCard}
                  style={{ "--tilt": `${SEE_TILT[i % SEE_TILT.length]}deg` } as CSSProperties}
                >
                  <Pic
                    edit={edit}
                    path={["see", i, "photo"]}
                    photo={x.photo ?? null}
                    caption={false}
                    sizes="300px"
                    style={{ aspectRatio: "4/3" }}
                  />
                  <div className={styles.seeText}>
                    <Text edit={edit} path={["see", i, "name"]} value={x.name} className={styles.seeName} label="Place name" placeholder="Place" />
                    <Text
                      edit={edit}
                      path={["see", i, "line"]}
                      value={x.line}
                      className={styles.seeLine}
                      label="What it's like"
                      placeholder="What it's like"
                    />
                    {(x.meta || edit) && (
                      <Text edit={edit} path={["see", i, "meta"]} value={x.meta} className={styles.seeMeta} label="Details" placeholder="Timings, tickets" />
                    )}
                  </div>
                  {edit && (
                    <ItemTools
                      noun="place"
                      index={i}
                      count={stop.see.length}
                      sideways
                      onMove={(to) => edit.move(["see"], i, to)}
                      onRemove={() => edit.remove(["see"], i)}
                    />
                  )}
                </div>
              ))}
            </div>
            {edit && <AddButton onClick={() => edit.insert(["see"], stop.see.length, { name: "", line: "", meta: "" })}>Add a place to see</AddButton>}
          </section>
        )}

        {showEat && (
          <section className={styles.section} style={{ gap: 24 }}>
            <h3 className={styles.sectionTitle}>What we ate</h3>
            <div className={styles.eatGrid}>
              {stop.eat.map((x, i) => (
                <div key={i} className={styles.eatCard}>
                  <div className={styles.eatHead}>
                    <Text edit={edit} path={["eat", i, "name"]} value={x.name} className={styles.eatName} label="Dish" placeholder="Dish" />
                    <Text edit={edit} path={["eat", i, "price"]} value={x.price} className={styles.eatPrice} label="Price" placeholder="Price" />
                  </div>
                  <Text edit={edit} path={["eat", i, "line"]} value={x.line} className={styles.eatLine} label="Where and how it was" placeholder="Where, and how it was" />
                  {edit && (
                    <ItemTools
                      noun="dish"
                      index={i}
                      count={stop.eat.length}
                      sideways
                      onMove={(to) => edit.move(["eat"], i, to)}
                      onRemove={() => edit.remove(["eat"], i)}
                    />
                  )}
                </div>
              ))}
            </div>
            {edit && <AddButton onClick={() => edit.insert(["eat"], stop.eat.length, { name: "", line: "", price: "" })}>Add a dish</AddButton>}
          </section>
        )}

        {showRoll && (
          <section className={styles.section} style={{ gap: 32 }}>
            <h3 className={styles.sectionTitle}>The whole camera roll</h3>
            <div className={styles.gallery}>
              {stop.photos.map((p, i) => (
                <figure
                  key={edit ? i : `${p.caption}-${i}`}
                  className={styles.galleryItem}
                  style={{ "--tilt": `${GALLERY_TILT[i % GALLERY_TILT.length]}deg` } as CSSProperties}
                >
                  <Pic edit={edit} path={["photos", i]} photo={p} caption={false} sizes="240px" style={{ aspectRatio: "1/1" }} />
                  <Text edit={edit} path={["photos", i, "caption"]} value={p.caption} as="figcaption" className={styles.galleryCaption} label="Caption" placeholder="Caption" />
                  {edit && (
                    <ItemTools
                      noun="photo"
                      index={i}
                      count={stop.photos.length}
                      sideways
                      onMove={(to) => edit.move(["photos"], i, to)}
                      onRemove={() => edit.remove(["photos"], i)}
                    />
                  )}
                </figure>
              ))}
              {edit && (
                <AddPhotos
                  edit={edit}
                  className={styles.galleryItem}
                  onAdd={(photos) => photos.forEach((p, k) => edit.insert(["photos"], stop.photos.length + k, p))}
                />
              )}
            </div>
          </section>
        )}

        <div className={styles.endButtons}>
          <Link href={stateHref(trip.stateId)} scroll={false} className={styles.primaryButton}>
            See this trip on the map
          </Link>
          <Link href={homeHref} scroll={false} className={styles.secondaryButton}>
            Back to all of India
          </Link>
        </div>
      </article>

      {bar ?? (viewer && <EditBar viewer={viewer} tripSlug={trip.slug} stopSlug={stop.slug} />)}
    </div>
  );
}

type TextProps = {
  edit?: EditApi;
  path: Path;
  value: string;
  as?: ElementType;
  className?: string;
  label: string;
  placeholder?: string;
  /** Bold and italic, and line breaks with Shift+Enter. */
  rich?: boolean;
  multiline?: boolean;
  onSplit?: (before: string, after: string) => void;
  onRemoveEmpty?: () => void;
};

/** Text that turns editable on the edit page. */
function Text({ edit, path, value, as: Tag = "span", className, rich, multiline, ...rest }: TextProps) {
  if (!edit) return <Tag className={className}>{rich ? <InlineText text={value} /> : value}</Tag>;
  return (
    <EditableText
      as={Tag}
      className={className}
      value={value}
      rich={rich}
      multiline={multiline ?? rich}
      onChange={(v) => edit.set(path, v)}
      {...rest}
    />
  );
}

type PicProps = React.ComponentProps<typeof Photo> & {
  edit?: EditApi;
  path: Path;
  /** Where to put the first upload when there's no photo here yet. Defaults to `path`. */
  onEmpty?: (photo: PhotoData) => void;
};

/**
 * A photo that can be uploaded or replaced on the edit page. Posts show uploaded photos
 * whole, at their own proportions, so nobody's face gets cropped off.
 */
function Pic({ edit, path, onEmpty, photo, ...rest }: PicProps) {
  if (!edit) return <Photo photo={photo} natural {...rest} />;
  return <PhotoSlot edit={edit} photo={photo} natural onChange={(p) => (photo || !onEmpty ? edit.set(path, p) : onEmpty(p))} {...rest} />;
}

type FigureProps = {
  photo: PhotoData;
  aspect: string;
  tilt: number;
  variant: "side" | "duo" | "trio";
  tape?: { left: string; width: number; rotate: number; color: "yellow" | "green" | "pink"; height?: number };
  marginTop?: number;
  edit?: EditApi;
  path: Path;
};

const FIGURE_SIZES = { side: "280px", duo: "(max-width: 760px) 100vw, 460px", trio: "(max-width: 760px) 100vw, 320px" };

function Figure({ photo, aspect, tilt, variant, tape, marginTop, edit, path }: FigureProps) {
  return (
    <figure
      className={`${styles.figure} ${styles[variant]}`}
      style={{ "--tilt": `${tilt}deg`, marginTop } as CSSProperties}
    >
      <Pic
        edit={edit}
        path={path}
        photo={photo}
        caption={false}
        stripe={variant === "trio" ? 6 : 7}
        sizes={FIGURE_SIZES[variant]}
        style={{ aspectRatio: aspect }}
      />
      <Text edit={edit} path={[...path, "caption"]} value={photo.caption} as="figcaption" className={styles.figCaption} label="Caption" placeholder="Caption" />
      {tape && (
        <div
          className={`${styles.tape} ${styles[tape.color]}`}
          style={{ left: tape.left, width: tape.width, height: tape.height ?? 18, rotate: `${tape.rotate}deg` }}
        />
      )}
    </figure>
  );
}

function Block({ block: b, edit, index }: { block: StoryBlock; edit?: EditApi; index: number }) {
  const at = (...rest: Path): Path => ["story", index, ...rest];
  const text = (className: string, placeholder: string, Tag: ElementType = "p") =>
    "text" in b && (
      <Text
        edit={edit}
        path={at("text")}
        value={b.text}
        as={Tag}
        className={className}
        label={placeholder}
        placeholder={placeholder}
        rich
        onSplit={b.type === "p" ? (before, after) => edit?.splitBlock(index, before, after) : undefined}
        onRemoveEmpty={() => edit?.removeEmptyBlock(index)}
      />
    );

  switch (b.type) {
    case "h":
      return (
        <div className={styles.blockHeading}>
          {(b.kicker || edit) && (
            <Text edit={edit} path={at("kicker")} value={b.kicker ?? ""} className={styles.kicker} label="Kicker" placeholder="Kicker (optional)" />
          )}
          <Text
            edit={edit}
            path={at("title")}
            value={b.title}
            as="h2"
            className={styles.h2}
            label="Heading"
            placeholder="Heading"
            onRemoveEmpty={() => edit?.removeEmptyBlock(index)}
          />
        </div>
      );
    case "p":
      return text(styles.paragraph, "Write something...");
    case "side":
      return (
        <div className={styles.sideRow}>
          {text(styles.sideText, "Text beside the photo")}
          <Figure edit={edit} path={at("photo")} photo={b.photo} aspect="4/5" tilt={3} variant="side" tape={{ left: "36%", width: 62, rotate: -6, color: "yellow" }} />
        </div>
      );
    case "sideL":
      return (
        <div className={`${styles.sideRow} ${styles.sideLeft}`}>
          <Figure edit={edit} path={at("photo")} photo={b.photo} aspect="1/1" tilt={-3} variant="side" tape={{ left: "30%", width: 62, rotate: 5, color: "green" }} />
          {text(styles.sideText, "Text beside the photo")}
        </div>
      );
    case "duo":
      return (
        <div className={styles.duoRow}>
          <Figure edit={edit} path={at("photos", 0)} photo={b.photos[0]} aspect="4/3" tilt={-2} variant="duo" tape={{ left: "40%", width: 64, rotate: -5, color: "yellow" }} />
          <Figure
            edit={edit}
            path={at("photos", 1)}
            photo={b.photos[1]}
            aspect="1/1"
            tilt={3}
            variant="duo"
            marginTop={40}
            tape={{ left: "36%", width: 60, rotate: 6, color: "green" }}
          />
        </div>
      );
    case "trio":
      return (
        <div className={styles.trioRow}>
          <Figure edit={edit} path={at("photos", 0)} photo={b.photos[0]} aspect="1/1" tilt={-3} variant="trio" />
          <Figure
            edit={edit}
            path={at("photos", 1)}
            photo={b.photos[1]}
            aspect="4/5"
            tilt={2}
            variant="trio"
            marginTop={34}
            tape={{ left: "38%", width: 56, height: 16, rotate: -4, color: "pink" }}
          />
          <Figure edit={edit} path={at("photos", 2)} photo={b.photos[2]} aspect="1/1" tilt={-1.5} variant="trio" marginTop={8} />
        </div>
      );
    case "quote":
      return (
        <blockquote className={styles.quote}>
          <span className={styles.quoteMark} aria-hidden>
            &quot;
          </span>
          {text(styles.quoteText, "A line worth remembering", "span")}
        </blockquote>
      );
    case "wide":
      return (
        <figure
          className={styles.wide}
          style={b.photo.image ? ({ "--ratio": b.photo.image.width / b.photo.image.height } as CSSProperties) : undefined}
        >
          <Pic edit={edit} path={at("photo")} photo={b.photo} label="wide photo" stripe={9} sizes="(max-width: 1100px) 100vw, 1100px" className={styles.wideImage} />
          <Text edit={edit} path={at("photo", "caption")} value={b.photo.caption} as="figcaption" className={styles.wideCaption} label="Caption" placeholder="Caption" />
          <div className={`${styles.tape} ${styles.pink}`} style={{ top: -10, left: "12%", width: 80, height: 20, rotate: "-4deg" }} />
          <div className={`${styles.tape} ${styles.pink}`} style={{ top: -10, right: "12%", width: 80, height: 20, rotate: "5deg" }} />
        </figure>
      );
    case "tip":
      return (
        <div className={styles.tip}>
          <div className={`${styles.tape} ${styles.yellow}`} style={{ top: -9, left: 24, width: 62, height: 18, rotate: "-4deg" }} />
          <span className={styles.tipLabel}>Local tip</span>
          {text(styles.tipText, "What should the next visitor know?", "span")}
        </div>
      );
  }
}
