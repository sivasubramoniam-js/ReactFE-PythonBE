
import { styled, useTheme } from '@mui/material/styles';

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme }) => ({
      flexGrow: 1,
      padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginRight: "-35vw",
      /**
       * This is necessary to enable the selection of content. In the DOM, the stacking order is determined
       * by the order of appearance. Following this rule, elements appearing later in the markup will overlay
       * those that appear earlier. Since the Drawer comes after the Main content, this adjustment ensures
       * proper interaction with the underlying content.
       */
      position: 'relative',
      variants: [
        {
          props: ({ open }) => open,
          style: {
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            marginRight: 0,
          },
        },
      ],
    }),
  );

  export default Main;