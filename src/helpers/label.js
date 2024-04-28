export const track = (value) => {
    switch (value) {
        case 'academic':
            return 'Academic';
        case 'tvl':
            return 'TVL';
        default:
            return value;
    }
};

export const strand = (value) => {
    switch (value) {
        case 'com_sys_serv':
            return 'I/A Computer System Servicing';
        default:
            return value;
    }
};

const LabelHelper = {
    track,
    strand,
};
export default LabelHelper;
