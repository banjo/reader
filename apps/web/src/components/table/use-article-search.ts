import { Filter } from "@/hooks/shared/use-filters";
import { Paginate } from "@/hooks/shared/use-pagination";
import { articleSearchMaxLength, normalizeArticleSearch } from "model";
import { useEffect, useRef, useState } from "react";

export const ARTICLE_SEARCH_DEBOUNCE_MS = 300;

export type ArticleSearchControls = {
    search: string;
    setSearch: (value: string) => void;
    clearSearch: () => void;
};

export const useArticleSearch = (filter?: Filter, paginate?: Paginate): ArticleSearchControls => {
    const [draft, setDraft] = useState(() => filter?.search() ?? "");
    const committed = filter?.search() ?? "";
    const commitRef = useRef(filter?.setSearch);
    const setPageRef = useRef(paginate?.setPage);
    commitRef.current = filter?.setSearch;
    setPageRef.current = paginate?.setPage;

    useEffect(() => {
        const next = normalizeArticleSearch(draft) ?? "";
        if (next === committed) {
            return;
        }

        const timeout = window.setTimeout(() => {
            commitRef.current?.(next);
            setPageRef.current?.(1);
        }, ARTICLE_SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timeout);
    }, [draft, committed]);

    const clearSearch = () => {
        setDraft("");
        if (committed !== "") {
            commitRef.current?.("");
            setPageRef.current?.(1);
        }
    };

    return {
        search: draft.slice(0, articleSearchMaxLength),
        setSearch: value => setDraft(value.slice(0, articleSearchMaxLength)),
        clearSearch,
    };
};
