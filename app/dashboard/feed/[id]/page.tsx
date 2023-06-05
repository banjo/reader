type Props = {
    params: {
        id: string;
    };
};

export default function FeedPage({ params }: Props) {
    const { id } = params;
    return <div>feed for {id}</div>;
}
