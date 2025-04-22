import { ImpressionNode } from "@/types/Nodes";
import PartImpressionContainer from "./PartImpressionContainer";
import PartImpressionNode from "./PartImpressionNode";
import { ImpressionType } from "@/types/Impressions";

const PartImpressionList = ({
  data,
  type,
  partId,
}: {
  data: ImpressionNode[];
  type: ImpressionType;
  partId: string;
}) => (
  <PartImpressionContainer type={type}>
    {data.map((item) => {
      return (
        <PartImpressionNode
          item={item}
          type={type}
          key={`PartImpressionNode ${item.id}`}
          partId={partId}
        />
      );
    })}
  </PartImpressionContainer>
);

export default PartImpressionList;
